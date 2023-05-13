import React, { useContext, useState } from 'react';
import ky from 'ky';
import { useHistory } from 'react-router-dom';
import { Button, CircularProgress, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import clsx from 'clsx';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import useMainStyles from '../../App.styles';
import useStyles from './RichTextEditor.style';
import StatusLabel from '../../components/StatusLabel/StatusLabel';
import { useAsync } from '../../hooks/useAsync';
import { apiUrl, AuthContext } from '../../App';

export interface RichTextEditorFormValues {
  message: string;
  has_mailing: string;
}

const CustomButtonSpoiler = () => <span>Спойлер</span>;

const CodeBlock = Quill.import('formats/strike');

class StyledCodeBlock extends CodeBlock {
  static create(value: string) {
    const node = super.create();
    node.setAttribute('style', 'background-color: #c1c1c1');
    return node;
  }
}

StyledCodeBlock.blotName = 'spoiler';
StyledCodeBlock.tagName = 'span';
StyledCodeBlock.className = 'tg-spoiler';
Quill.register(StyledCodeBlock, true);

const CustomToolbar = () => (
  <div id="toolbar">
    <button className="ql-bold" type="button">
      {' '}
    </button>
    <button className="ql-italic" type="button">
      {' '}
    </button>
    <button className="ql-underline" type="button">
      {' '}
    </button>
    <button className="ql-strike" type="button">
      {' '}
    </button>
    <button className="ql-link" type="button">
      {' '}
    </button>
    <button className="ql-spoiler" type="button">
      <CustomButtonSpoiler />
    </button>
  </div>
);
const formats = ['bold', 'italic', 'underline', 'strike', 'link', 'spoiler'];
const modules = {
  toolbar: {
    container: '#toolbar',
  },
  clipboard: {
    matchVisual: false,
  },
};


interface IRichTextEditorInterface {
  isMenuOpen: boolean
}

const RichTextEditor: React.FC<IRichTextEditorInterface> = ({ isMenuOpen }) => {
  const classes = useStyles();
  const mainClasses = useMainStyles();
  const history = useHistory();
  const [empty, setEmpty] = useState(true);
  const { userToken, refreshToken, setUserToken, setRefreshToken } = useContext(AuthContext);
  const onSubmitMessage = async (data: RichTextEditorFormValues) => {
    const stripTags = data.message.replace(/(<p[^>]+?>|<p>)/gim, '');
    const replaceEnclosedTag = stripTags.replace(/(<br[^>]+?>|<br>|<\/p>)/gim, '\n');
    const normalizedData = { message: replaceEnclosedTag };
    try {
      const response = await ky.post(`${apiUrl}/send_telegram_notification/`, {
        json: {
          has_mailing: data.has_mailing,
          ...normalizedData,
        },
        retry: {
          limit: 2,
          methods: ['post'],
          statusCodes: [401, 422],
        },
        throwHttpErrors: false,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        hooks: {
          afterResponse: [
            // eslint-disable-next-line consistent-return
            async (request, options, res) => {
              if (res.status === 401) {
                const resp = await ky.post(`${apiUrl}/auth/token_refresh/`, {
                  headers: {
                    Authorization: `Bearer ${refreshToken}`,
                  },
                });
                const token = await resp.json();

                request.headers.set('Authorization', `Bearer ${token.access_token}`);
                if (resp.status === 200) {
                  setUserToken(token.access_token as string);
                  setRefreshToken(token.refresh_token as string);
                  return ky(request);
                }
                history.push('/');
              }
            },
          ],
        },
      });
      if (response.status === 200) {
        return await response.json();
      }
      return Promise.reject(new Error(`Server responded with status ${response.status}`));
    } catch (e: any) {
      return Promise.reject(e.message);
    }
  };
  const { handleSubmit, control, reset } = useForm<RichTextEditorFormValues>();

  const { data, error, run, isError, setError, setData, isLoading } = useAsync({
    data: null,
    error: null,
  });

  const statusMessage = isError ? (error as string) : ((data?.result ?? '') as string);

  const isStatusLabelOpen = Boolean(error) || Boolean(data?.result);
  const handleResetLabel = () => {
    if (isError) {
      setError(null);
      return;
    }
    setData(null);
  };

  return (
    <main
      className={clsx(mainClasses.content, {
        [mainClasses.contentShift]: isMenuOpen,
      })}>
      <form
        className={classes.form}
        onSubmit={handleSubmit((dataS, e) => {
          const text = { message: dataS.message.replace(/<\/?p>|<br>/g, ''), has_mailing: dataS.has_mailing };
          run(onSubmitMessage(text))
            .then((res: any) => {
              if (res === undefined) {
                setError('Something went wrong');
              } else {
                reset({ message: '' });
                setEmpty(true);
              }
            })
            .catch((err: any) => {
              setError(err.message);
            });
        })}>
        <Typography variant="h5">Отправить сообщение пользователям</Typography>
        <StatusLabel
          isStatusLabelOpen={isStatusLabelOpen}
          statusMessage={statusMessage}
          isError={isError}
          handleCloseError={handleResetLabel}
        />
        <Typography className={classes.title}>Выберите вариант отправки сообщения</Typography>
        <Controller
          defaultValue="subscribed"
          render={({ field }) => (
            <RadioGroup className={classes.radioButtonGroup} aria-label="Mailing" {...field}>
              <FormControlLabel value="subscribed" control={<Radio />} label="Уведомления включены" />
              <FormControlLabel value="unsubscribed" control={<Radio />} label="Уведомления выключены" />
              <FormControlLabel value="all" control={<Radio />} label="Всем" />
            </RadioGroup>
          )}
          name="has_mailing"
          control={control}
        />

        <Controller
          name="message"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <div className={classes.quill}>
              <CustomToolbar />
              <ReactQuill
                preserveWhitespace
                className={classes.quill}
                modules={modules}
                formats={formats}
                theme="snow"
                {...field}
                onKeyDown={() => {
                  setEmpty(false);
                }}
              />
            </div>
          )}
        />

        {isLoading ? (
          <CircularProgress />
        ) : (
          <Button className={classes.authFormButton} type="submit" disabled={empty}>
            отправить
          </Button>
        )}
      </form>
    </main>
  );
};

export default RichTextEditor;
