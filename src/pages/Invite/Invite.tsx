/* eslint-disable consistent-return */
/* eslint-disable no-console */
import { yupResolver } from '@hookform/resolvers/yup';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import { Button, TextField, CircularProgress, Typography } from '@mui/material';
import * as yup from 'yup';
import ky, { Options } from 'ky';
import React, {useContext} from 'react';
import { useForm, Controller } from 'react-hook-form';
import useStyles from '../AuthForm/AuthForm.styles';
import StatusLabel from '../../components/StatusLabel/StatusLabel';
import { useAsync } from '../../hooks/useAsync';
import useMainStyles from '../../App.styles';
import { apiUrl, AuthContext } from '../../App';


interface IInviteProps {
  children?: React.ReactNode;
  isMenuOpen: boolean
}

const schema = yup.object().shape({
  email: yup.string().email('Такой e-mail не подойдет').required('Поле e-mail необходимо к заполнению'),
});

export interface InviteFormValues extends Options {
  email: string;
}

const Invite: React.FC<IInviteProps> = ({  isMenuOpen }) => {
  const classes = useStyles();
    const mainClasses = useMainStyles();
  const { data, error, run, isError, setData, isLoading, setError } = useAsync({
    data: null,
    error: null,
    status: 'idle',
  });
const history = useHistory();
  const statusMessage = isError ? (error as string) : ((data?.message ?? '') as string);
const { setRefreshToken, setUserToken, refreshToken, userToken } = useContext(AuthContext);
  const onInvite = async (dataInvite: InviteFormValues) => {
    try {
      const response = await ky.post(`${apiUrl}/auth/invitation/`, {
        retry: {
          limit: 2,
          methods: ['get'],
          statusCodes: [401, 422],
        },
        hooks: {
          beforeRetry: [
            // eslint-disable-next-line @typescript-eslint/no-shadow
            async ({ request, options, error, retryCount }) => {
              if (retryCount === 1) {
                setUserToken(false);
                setRefreshToken(false);
                history.push('/');
                return ky.stop;
              }
            },
          ],
          afterResponse: [
            // eslint-disable-next-line consistent-return
            async (request, options, res) => {
              if (res.status === 401) {
                const resp = await ky.post(`${apiUrl}/auth/token_refresh/`, {
                  headers: {
                    Authorization: `Bearer ${refreshToken}`,
                  },
                });

                if (resp.status === 200) {
                  const token = await resp.json();
                  request.headers.set('Authorization', `Bearer ${token.access_token}`);
                  setUserToken(token.access_token as string);
                  setRefreshToken(token.refresh_token as string);
                  return ky(request);
                }
                if (resp.status === 401 || resp.status === 422) {
                  setUserToken(false);
                  setRefreshToken(false);
                  history.push('/');
                }
              }
            },
          ],
        },
        method: 'POST',
        body: JSON.stringify(dataInvite),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        throwHttpErrors: false,
      });

      if (response.status === 200) {
        const result = (await response.json()) as { message: string };

        return result;
      }
      const errorResponse = await response.json();
      throw new Error(errorResponse.message);
    } catch (e: any) {
      return Promise.reject(e);
    }
  };

  const isStatusLabelOpen = Boolean(error) || Boolean(data?.message);
  const handleResetLabel = () => {
    if (isError) {
      setError(null);
      return;
    }
    setData(null);
  };

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<Pick<InviteFormValues, 'email'>>({ resolver: yupResolver(schema), mode: 'onTouched' });

  return (
    <main
      className={clsx(mainClasses.content, {
        [mainClasses.contentShift]: isMenuOpen,
      })}>
      <div className={classes.invite}>
        <StatusLabel
          isStatusLabelOpen={isStatusLabelOpen}
          statusMessage={statusMessage}
          isError={isError}
          handleCloseError={handleResetLabel}
        />
        <Typography align='center' variant="h5">Пригласить нового администратора</Typography>
        <form
          className={classes.authForm}
          onSubmit={handleSubmit((dataS, e) => {
            run(onInvite(dataS));
            console.log(e?.target.reset());
            reset({ email: '' });
            e?.target.reset();
          })}>
          <fieldset className={classes.authFormInputContainer}>
            <Controller
              name="email"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  label="E-mail"
                  error={Boolean(errors.email?.message)}
                  helperText={errors.email?.message}
                  className={classes.authFormInput}
                  size="medium"
                  variant="outlined"
                  {...field}
                />
              )}
            />
          </fieldset>
          {isLoading ? (
            <CircularProgress />
          ) : (
            <Button className={classes.authFormButton} type="submit">
              отправить
            </Button>
          )}
        </form>
      </div>
    </main>
  );
};

export default Invite;
