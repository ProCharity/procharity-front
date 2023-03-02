/* eslint-disable no-nested-ternary */
/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import React, { useContext, useEffect, useState } from 'react';
import ky from 'ky';
import { useHistory } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import DesktopDatePicker from '@mui/lab/DesktopDatePicker';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import ru from 'date-fns/locale/ru';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { format, parseISO, max, isValid, isBefore } from 'date-fns';
import clsx from 'clsx';
import { Button, TextField, Typography } from '@mui/material';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Chart from '../../components/Chart/Chart';
import ActionsStats from '../../components/ActionsStats/ActionsStats';
import Users from '../../components/UserStats/Users';
import Preloader from '../../components/Preloader/Preloader';
import { useAsync } from '../../hooks/useAsync';
import StatusLabel from '../../components/StatusLabel/StatusLabel';
import useStyles from './Dashboard.styles';
import useMainStyles from '../../App.styles';
import { apiUrl, AuthContext } from '../../App';


const schema = yup.object().shape({
  date: yup.string().min(10, 'Введите дату в формате ДД-ММ-ГГГГ').required('Поле e-mail необходимо к заполнению'),
});

export interface IuserStats {
  time: string;
  amount: number;
}
const active = ['Активная', 'Активные', 'Активных'];
const task = ['задача', 'задачи', 'задач'];
function declOfNum(n: number, titles: any) {
  return titles[
    n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2
  ];
}


export interface IUserData {
  active_users: number;
  number_users: {
    all_users: number;
    banned_users: number;
    not_subscribed_users: number;
    subscribed_users: number;
  };
  deactivated_users: number;
  added_users: { [key: string]: number };
  users_unsubscribed: { [key: string]: number };
  distinct_users_unsubscribed: { [key: string]: number };
  active_users_statistic: {
    all: {
      [key: string]: number;
    };
    subscribed: {
      [key: string]: number;
    };
    unsubscribed: {
      [key: string]: number;
    };
  };
  all_users_statistic: {
    added_external_users: {
      [key: string]: number;
    };
    added_users: {
      [key: string]: number;
    };
    users_unsubscribed: {
      [key: string]: number;
    };
  };
  command_stats: {
    [key: string]: number;
  };
  reasons_canceling: {
    [key: string]: number;
  };
}

export interface IUsersTableData {
  total: number;
  pages: number;
  previous_page: null;
  current_page: number;
  next_page: number;
  next_url: string;
  previous_url: null;
  result: IResult[];
}

export interface IResult {
  telegram_id: number;
  username: string;
  email: null;
  first_name: string;
  last_name: string;
  external_id: null;
  has_mailing: boolean;
  date_registration: string;
}

interface IDashboardProps {

  isMenuOpen: boolean;
}
export interface IDashboardDateValues {
  date: string;
}

const Dashboard: React.FC<IDashboardProps> = ({  isMenuOpen }) => {
  const mainClasses = useMainStyles();
  const history = useHistory();
    const classes = useStyles();

  const {setUserToken, setRefreshToken, refreshToken, userToken}  = useContext(AuthContext)
    const getUsers = async (usersDate: string) => {
      try {
        const dateLimit = usersDate ? `?date_limit=${usersDate}` : '';

        const response = await ky(`${apiUrl}/analytics/${dateLimit}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          throwHttpErrors: false,
          retry: {
            limit: 2,
            methods: ['get'],
            statusCodes: [401, 422],
          },
          hooks: {
            beforeRetry: [
              // eslint-disable-next-line consistent-return
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
                if (res.status === 401 || res.status === 422) {
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
        });

        if (response.status === 200) {
          const userData: IUserData = (await response.json()) as IUserData;

          return userData;
        }
        const error = await response.json();

        throw new Error(error.message);
      } catch (e: any) {
        return Promise.reject(e.message);
      }
    };
  const [errorDate, setErrorDate] = useState(false);
  const { handleSubmit, setValue } = useForm<IDashboardDateValues>({ resolver: yupResolver(schema), mode: 'onTouched' });
  const { data, error, run, isError, reset, isLoading } = useAsync({ status: 'idle', data: null, error: null });

  const [value, setDateValue] = React.useState<Date | null>(new Date());

  useEffect(() => {
  
    run(getUsers(''));
    if (data?.all_users_statistic.added_users)
      setDateValue(max(Object.keys(data?.all_users_statistic.added_users).map((item: string) => parseISO(item))));
    if (value) setValue('date', format(value, 'yyyy-MM-dd'));
  }, [run]);
  return (
    <main
      className={clsx(mainClasses.content, {
        [mainClasses.contentShift]: isMenuOpen,
      })}>
      {isLoading ? (
        <Preloader />
      ) : (
<>
          <StatusLabel
            isStatusLabelOpen={isError && errorDate}
            statusMessage={error}
            isError={isError}
            handleCloseError={reset}
          />
          <Container maxWidth="lg" className={classes.container}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3} lg={3}>
                <Paper className={classes.paperUsers}>
                  <Users text={data?.number_users.all_users ?? 0} title="Всего пользователей" />
                </Paper>
              </Grid>
              <Grid item xs={12} md={3} lg={3}>
                <Paper className={classes.paperUsers}>
                  <Users text={data?.number_users.subscribed_users ?? 0} title="Подписка включена" />
                </Paper>
              </Grid>
              <Grid item xs={12} md={3} lg={3}>
                <Paper className={classes.paperUsers}>
                  <Users text={data?.number_users.not_subscribed_users ?? 0} title="Подписка выключена" />
                </Paper>
              </Grid>
              <Grid item xs={12} md={3} lg={3}>
                <Paper className={classes.paperUsers}>
                  <Users text={data?.number_users.banned_users ?? 0} title="Бот заблокирован" />
                </Paper>
              </Grid>
              <Grid item xs={12} md={3} lg={3}>
                <Paper className={classes.paperUsers}>
                  <Users
                    text={data?.active_users_statistic.active_users_per_month ?? 0}
                    title="Активных пользователей в месяц"
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={3} lg={3}>
                <Paper className={classes.paperUsers}>
                  <Users
                    lastUpdate={data?.tasks.last_update}
                    text={data?.tasks.active_tasks ?? 0}
                    title={`${declOfNum(data?.tasks.active_tasks ?? 0, active)} ${declOfNum(
                      data?.tasks.active_tasks ?? 0,
                      task,
                    )}`}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} md={12} lg={12}>
                <Paper className={clsx(classes.fixedHeight, classes.paper)}>
                  <div className={classes.pickerContainer}>
                    <Typography className={classes.title} variant="h6">
                      Статистика пользователей за месяц
                    </Typography>
                    <form
                      className={classes.formContainer}
                      onSubmit={handleSubmit((dataDate, e) => {
                        setErrorDate(false);
                        if (!isBefore(parseISO(dataDate.date), new Date(2021, 8, 1))) {
                          run(getUsers(dataDate.date));
                        } else {
                          setErrorDate(true);
                        }
                      })}>
                      <div className={classes.picker}>
                        <Typography className={classes.title} variant="h6">
                          Cтатистика до
                        </Typography>
                        <LocalizationProvider dateAdapter={AdapterDateFns} locale={ru}>
                          <DesktopDatePicker
                            minDate={new Date(2021, 8, 1)}
                            disableFuture
                            openTo="day"
                            orientation="portrait"
                            value={value}
                            label="ДД.ММ.ГГГГ"
                            mask="__.__.____"
                            onChange={(val) => {
                              if (val && isValid(val)) {
                                setValue('date', format(val, 'yyyy-MM-dd'), {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                                setDateValue(val);
                              } else {
                                const v = (val as unknown as string) ?? '';
                                setValue('date', v);
                                setDateValue(null);
                              }
                            }}
                            renderInput={(params) => <TextField {...params} />}
                          />
                        </LocalizationProvider>
                        <span className={errorDate ? classes.errorDate : classes.errorDateHidden}>
                          Введите дату до 01.09.2021
                        </span>
                      </div>
                      <Button className={classes.button} type="submit">
                        <Typography className={classes.buttonText} variant="body1">
                          Показать
                        </Typography>
                      </Button>
                    </form>
                  </div>
                  <Chart data={data} title="Статистика пользователей за месяц" />
                </Paper>
              </Grid>

              <Grid item xs={12} md={12} lg={12}>
                <Paper className={clsx(classes.fixedHeight, classes.paper)}>
                  <div className={classes.pickerContainer}>
                    <Typography className={classes.title} variant="h6">
                      Статистика активных пользователей за месяц
                    </Typography>
                    <form
                      className={classes.formContainer}
                      onSubmit={handleSubmit((dataDate, e) => {
                        setErrorDate(false);
                        if (!isBefore(parseISO(dataDate.date), new Date(2021, 8, 1))) {
                          run(getUsers(dataDate.date));
                        } else {
                          setErrorDate(true);
                        }
                      })}>
                      <div className={classes.picker}>
                        <Typography className={classes.title} variant="h6">
                          Cтатистика до
                        </Typography>
                        <LocalizationProvider dateAdapter={AdapterDateFns} locale={ru}>
                          <DesktopDatePicker
                            minDate={new Date(2021, 8, 1)}
                            disableFuture
                            openTo="day"
                            orientation="portrait"
                            value={value}
                            label="ДД.ММ.ГГГГ"
                            mask="__.__.____"
                            onChange={(val) => {
                              if (val && isValid(val)) {
                                setValue('date', format(val, 'yyyy-MM-dd'), {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                                setDateValue(val);
                              } else {
                                const v = (val as unknown as string) ?? '';
                                setValue('date', v);
                                setDateValue(null);
                              }
                            }}
                            renderInput={(params) => <TextField {...params} placeholder="ДД.ММ.ГГГГ" />}
                          />
                        </LocalizationProvider>
                        <span className={errorDate ? classes.errorDate : classes.errorDateHidden}>
                          Введите дату до 01.09.2021
                        </span>
                      </div>
                      <Button className={classes.button} type="submit">
                        <Typography className={classes.buttonText} variant="body1">
                          Показать
                        </Typography>
                      </Button>
                    </form>
                  </div>
                  <Chart data={data} title="Статистика активных пользователей за месяц" />
                </Paper>
              </Grid>

              <Grid item xs={12} md={6} lg={6}>
                <Paper className={classes.paper}>
                  <ActionsStats
                    cardTitle="Статистика команд"
                    title="Название Команды"
                    actionsStats={data?.command_stats}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6} lg={6}>
                <Paper className={classes.paper}>
                  <ActionsStats
                    cardTitle="Статистика отписок"
                    title="Причина отписки"
                    actionsStats={data?.reasons_canceling}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Container>
   </>
      )}
    </main>
  );
};

export default Dashboard;
