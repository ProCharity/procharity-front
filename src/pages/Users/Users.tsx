import { TableContainer, TableHead, Table, TableRow, TableCell, TableBody } from '@mui/material';
import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import ky from 'ky';
import clsx from 'clsx';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import { IUsersTableData } from '../Dashboard/Dashboard';
import Preloader from '../../components/Preloader/Preloader';
import StatusLabel from '../../components/StatusLabel/StatusLabel';
import { useAsync } from '../../hooks/useAsync';
import useLocalStorage from '../../hooks/useLocalStorage';
import useStyles from './Users.styles';
import useMainStyles from '../../App.styles';
import { apiUrl, AuthContext } from '../../App';

interface IUsersProps {
  isMenuOpen: boolean;
}

export const formatData = (date: string) => {
  const options: any = { day: 'numeric', month: 'long', year: 'numeric' };
  const dateIso = new Date(date);
  const dateLocalized = new Intl.DateTimeFormat('ru-Ru', options).format(dateIso);
  return dateLocalized;
};
const columns = ['ФИО', 'E-mail', 'Рассылка', 'Бот заблокирован', 'Имя пользователя', 'Дата Регистрации'];

const Users: React.FC<IUsersProps> = ({ isMenuOpen }) => {
  const history = useHistory();
  const { userToken, refreshToken, setUserToken, setRefreshToken } = useContext(AuthContext);
  const getUsersData = async (page: number, limit: number) => {
    try {
      const response = await ky(`${apiUrl}/users/?page=${page}&limit=${limit}`, {
        redirect: 'follow',
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
              if (res.status === 401) {
                const resp = await ky.post(`${apiUrl}/auth/token_refresh/`, {
                  redirect: 'follow',
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

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (response.status === 200) {
        const userData = (await response.json()) as IUsersTableData;
        return userData;
      }
      return Promise.reject(new Error(`Server responded with status ${response.status}`));
    } catch (e: any) {
      return Promise.reject(e.message);
    }
  };

  const classes = useStyles();
  const mainClasses = useMainStyles();
  const { data, error, isLoading, run, isError, reset } = useAsync({ status: 'idle', data: null, error: null });
  const [rowsPerPage, setRowsPerPage] = useLocalStorage<number>('rowsPerPage', 20);
  const [page, setPage] = useLocalStorage<number>('page', 1);
  const handleChangePage = (_event: unknown, newPage: number) => {
    run(getUsersData(newPage + 1, rowsPerPage));
    setPage(newPage + 1);
  };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    run(getUsersData(1, +event.target.value));
    setPage(1);
  };
  React.useEffect(() => {
    run(getUsersData(page, rowsPerPage));
  }, []);

  return (
    <main
      className={clsx(mainClasses.content, {
        [mainClasses.contentShift]: isMenuOpen,
      })}>
      {isLoading ? (
        <Preloader />
      ) : (
        <section className={classes.section}>
          <StatusLabel isError={isError} isStatusLabelOpen={isError} statusMessage={error} handleCloseError={reset} />
          <Typography className={classes.title} variant="h5">
            Пользователи
          </Typography>
          <TableContainer className={classes.root}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column} align="left">
                      <Typography className={classes.subtitle} variant="subtitle1">
                        {column}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.result.map((result: any) => (
                  <TableRow key={result.telegram_id}>
                    <TableCell align="left">
                      <Typography variant="subtitle1">{`${result.first_name ?? 'Не указан'} ${
                        result.last_name ?? ''
                      }`}</Typography>
                    </TableCell>
                    <TableCell align="left">
                      <Typography variant="subtitle1">{result.email ?? 'Не указан'}</Typography>
                    </TableCell>
                    <TableCell align="left">
                      <div className={classes.container}>
                        {result.has_mailing ? (
                          <CheckIcon fontSize="small" className={classes.iconCheckMark} />
                        ) : (
                          <ClearIcon fontSize="small" className={classes.iconCross} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell align="left">
                      <div className={classes.container}>
                        {result.banned ? (
                          <CheckIcon fontSize="small" className={classes.iconCheckMark} />
                        ) : (
                          <ClearIcon fontSize="small" className={classes.iconCross} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell align="left">
                      <Typography variant="subtitle1">{result.username ?? 'Не указан'}</Typography>
                    </TableCell>
                    <TableCell align="left">
                      <Typography variant="subtitle1">{formatData(result.date_registration)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              rowsPerPageOptions={[20, 50, 100]}
              count={data?.total - 1 ?? 0}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              page={page - 1 ?? 0}
              rowsPerPage={rowsPerPage}
            />
          </TableContainer>
        </section>
      )}
    </main>
  );
};
export default Users;
