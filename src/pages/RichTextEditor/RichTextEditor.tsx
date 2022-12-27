import React, { useContext } from 'react';
import ky from 'ky';
import { useHistory } from 'react-router-dom';
import { Button, CircularProgress, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import clsx from 'clsx';
import ReactQuill, { Quill }  from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import useMainStyles from '../../App.styles'
import useStyles from './RichTextEditor.style';
import StatusLabel from '../../components/StatusLabel/StatusLabel';
import { useAsync } from '../../hooks/useAsync';
import { apiUrl, AuthContext } from '../../App';



export interface RichTextEditorFormValues {
  message: string;
  has_mailing: string;
}

const Inline = Quill.import('blots/inline');
class ColorGreyBlot extends Inline {}
ColorGreyBlot.blotName = 'tg-spoiler';
ColorGreyBlot.tagName = 'span';
Quill.register('tg-spoiler', ColorGreyBlot);


const modules = {
  toolbar: [['bold', 'italic', 'underline', 'strike'], ['link'], ['tg-spoiler']],
  clipboard: {
    matchVisual: false,
  },
};

interface RichTextEditorInterface {

  isMenuOpen: boolean
}

const RichTextEditor: React.FC<RichTextEditorInterface> = ({ isMenuOpen }) => {
  const classes = useStyles();
  const mainClasses = useMainStyles();
    const history = useHistory();
  const {userToken, refreshToken, setUserToken, setRefreshToken} = useContext(AuthContext)
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
       const result = await response.json();
       return result;
     }
     const error = await response.json();
     throw new Error(error.message);
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
        run(onSubmitMessage(dataS));
        reset({ message: '' });
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
          <ReactQuill preserveWhitespace className={classes.quill} modules={modules} theme="snow" {...field} />
        )}
      />
      {isLoading ? (
        <CircularProgress />
      ) : (
        <Button className={classes.authFormButton} type="submit">
          отправить
        </Button>
      )}
    </form>
    </main>
  );
};

export default RichTextEditor;
