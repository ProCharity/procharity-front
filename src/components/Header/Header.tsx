import React, { useEffect, useContext } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Divider,
  List,
  Hidden,
  Popover,
  Paper,
  Typography,
} from '@mui/material';
import clsx from 'clsx';
import ky from 'ky';
import { parseISO, isValid, format } from 'date-fns';
import ru from 'date-fns/locale/ru';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { MainListItems, SecondaryListItems } from '../NavigationItems/NavigationItems';
import { useAsync } from '../../hooks/useAsync';
import { HealthCheck, AuthContext, apiUrl } from '../../App';
import BotStatus from '../BotStatus/BotStatus';
import useStyles from './Header.styles';




interface IHeaderProps {
  handleDrawerOpen: () => void;
  handleDrawerClose: () => void;
  handleSetTheme: () => void;
  isDark: boolean;
  isMenuOpen: boolean;
  handleCloseError: () => void;
}

const Header: React.FC<IHeaderProps> = ({
  handleDrawerOpen,
  handleDrawerClose,
  isMenuOpen,
  handleSetTheme,
  isDark,
  handleCloseError,
}) => {

  const getHealthCheck = async () => {
    try {
      const response = await ky(`${apiUrl}/health_check/`, {
        headers: {
          'Content-Type': 'application/json',
        },
        throwHttpErrors: false,
        retry: {
          limit: 2,
          methods: ['get'],
          statusCodes: [401],
        },
      });

      if (response.status === 200) {
        const userData: HealthCheck = (await response.json()) as HealthCheck;

        return userData;
      }
      const error = await response.json();

      throw new Error(error.message);
    } catch (e: any) {
      return Promise.reject(e.message);
    }
  };

  const classes = useStyles();
  const history = useHistory();
const context = useContext(AuthContext)
  const matchLogin = useRouteMatch('/')?.isExact ?? false;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  const matchRegister = useRouteMatch('/register/:id')?.isExact ?? false;
  const matchReset = useRouteMatch('/reset_password')?.isExact ?? false;
    const matchConfirm = useRouteMatch('/password_reset_confirm/:id')?.isExact ?? false;

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const handleLogout = () => {
    if(context.removeToken) context.removeToken();
    history.push('/');
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const { run, data, isError, isSuccess, isLoading } = useAsync({ status: 'idle', data: null, error: null });


  const update = data?.db.last_update ?? '';
  const updateCommit = data?.git.commit_date ?? ""
   const lastUpdateDate = parseISO(update);
   const updateCommitDate = parseISO(updateCommit);
     const commitDateLocalized = isValid(updateCommitDate)
       ? format(updateCommitDate, 'dd.MM.yyyy, hh:mm:ss', { locale: ru })
       : '';
  const dateLocalized = isValid(lastUpdateDate) ? format(lastUpdateDate, 'dd.MM.yyyy, hh:mm:ss', {locale: ru}) : '';
 

  useEffect(() => {
    run(getHealthCheck());
  }, [run]);
  const open = Boolean(anchorEl);

  return (
    <>
      {!(matchLogin || matchRegister || matchReset || matchConfirm) ? (
        <>
          <AppBar
            position="absolute"
            className={clsx(classes.appBar, isMenuOpen && !mobileOpen && classes.appBarShift)}>
            <Toolbar className={classes.toolbar}>
              <Hidden smDown implementation="css">
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="isMenuOpen drawer"
                  onClick={handleDrawerOpen}
                  className={clsx(classes.menuButton, isMenuOpen && classes.menuButtonHidden)}
                  size="large">
                  <MenuIcon />
                </IconButton>
              </Hidden>
              <Hidden smUp implementation="css">
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="isMenuOpen drawer"
                  onClick={handleDrawerToggle}
                  className={clsx(classes.menuButton)}
                  size="large">
                  <MenuIcon />
                </IconButton>
              </Hidden>
              <div className={classes.appBarSpacer} />
              <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}>
                <Paper className={classes.paper}>
                  <div className={classes.statusContainer}>
                    <Typography>Состояние работы бота</Typography>
                    {data?.bot.status ? (
                      <CheckIcon fontSize="small" className={classes.iconCheckMark} />
                    ) : (
                      <ClearIcon fontSize="small" className={classes.iconCross} />
                    )}
                    {!data?.bot.status && <Typography>{data?.bot.error}</Typography>}
                  </div>
                  <div className={classes.statusContainer}>
                    <Typography>Состояние работы сервера</Typography>
                    {data?.db.status ? (
                      <CheckIcon fontSize="small" className={classes.iconCheckMark} />
                    ) : (
                      <ClearIcon fontSize="small" className={classes.iconCross} />
                    )}
                    {!data?.db.status && <Typography>{data?.db.error}</Typography>}
                  </div>
                  <div className={classes.statusContainer}>
                    <Typography>Метод работы бота</Typography>
                    <Typography>{data?.bot.method}</Typography>
                  </div>
                  <Divider />
                  <div className={classes.statusContainer}>
                    <Typography>Активных задач</Typography>
                    <Typography>{data?.db.active_tasks}</Typography>
                  </div>
                  <div className={classes.statusContainer}>
                    <Typography>Последнее обновление задач</Typography>
                    <Typography className={classes.date}>{dateLocalized}</Typography>
                  </div>
                  <Divider />
                  {!isError && (
                    <div className={classes.statusContainer}>
                      <Typography>Коммит релиз</Typography>
                      <Typography>{data?.git.last_commit}</Typography>
                    </div>
                  )}
                  {!isError && (
                    <div className={classes.statusContainer}>
                      <Typography>Дата релиза</Typography>
                      <Typography>{commitDateLocalized}</Typography>
                    </div>
                  )}
                  {!isError && data?.git.tag && (
                    <div className={classes.statusContainer}>
                      <Typography>Версия релиза</Typography>
                      <Typography>{data?.git.tag}</Typography>
                    </div>
                  )}
                </Paper>
              </Popover>
              <IconButton onClick={handleClick} size="large">
                {!isLoading && <BotStatus status={data?.bot.status && data?.db.status && isSuccess} />}
              </IconButton>

              <IconButton onClick={handleSetTheme} size="large">
                {isDark ? <Brightness4Icon /> : <Brightness7Icon />}
              </IconButton>
            </Toolbar>
          </AppBar>
          <Hidden smDown implementation="css">
            <Drawer
              variant="permanent"
              classes={{
                paper: clsx(classes.drawerPaper, !isMenuOpen && classes.drawerPaperClose),
                root: classes.drawerPosition,
              }}
              open={isMenuOpen}>
              <div className={classes.toolbarIcon}>
                <IconButton onClick={handleDrawerClose} size="large">
                  <ChevronLeftIcon />
                </IconButton>
              </div>
              <Divider />
              <List>
                <MainListItems handleCloseError={handleCloseError} />
              </List>
              <Divider className={classes.divider} />

              <List>
                <SecondaryListItems handleLogout={handleLogout} />
              </List>
            </Drawer>
          </Hidden>
          <Hidden smUp implementation="css">
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              classes={{
                paper: classes.drawerPaper,
              }}
              className={classes.drawerPaperMobile}
              ModalProps={{
                keepMounted: true,
              }}>
              <List>
                <MainListItems handleCloseError={handleCloseError} />
              </List>
              <Divider />

              <List>
                <SecondaryListItems handleLogout={handleLogout} />
              </List>
            </Drawer>
          </Hidden>
        </>
      ) : (
        <div className={classes.headerContainer}>
          <h1 className={classes.authFormTitle}>ProCharity</h1>
          <div className={classes.buttonThemeContainer}>
            <IconButton onClick={handleSetTheme} size="large">
              {isDark ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>

            <IconButton onClick={handleClick} size="large">
              <BotStatus status={data?.bot.status && data?.db.status && !isError} />
            </IconButton>

            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}>
              <Paper className={classes.paper}>
                <div className={classes.statusContainer}>
                  <Typography>Состояние работы бота</Typography>
                  {data?.bot.status ? (
                    <CheckIcon fontSize="small" className={classes.iconCheckMark} />
                  ) : (
                    <ClearIcon fontSize="small" className={classes.iconCross} />
                  )}
                  {!data?.bot.status && <Typography>{data?.bot.error}</Typography>}
                </div>
                {!isError && (
                  <div className={classes.statusContainer}>
                    <Typography>Метод работы бота</Typography>
                    <Typography>{data?.bot.method}</Typography>
                  </div>
                )}
                <div className={classes.statusContainer}>
                  <Typography>Состояние работы сервера</Typography>
                  {data?.db.status ? (
                    <CheckIcon fontSize="small" className={classes.iconCheckMark} />
                  ) : (
                    <ClearIcon fontSize="small" className={classes.iconCross} />
                  )}
                  {!data?.db.status && <Typography>{data?.db.error}</Typography>}
                </div>
                {!isError && (
                  <div className={classes.statusContainer}>
                    <Typography>Активных задач</Typography>
                    <Typography>{data?.db.active_tasks}</Typography>
                  </div>
                )}
                {!isError && (
                  <div className={classes.statusContainer}>
                    <Typography>Последнее обновление задач</Typography>
                    <Typography>{dateLocalized}</Typography>
                  </div>
                )}
                {!isError && (
                  <div className={classes.statusContainer}>
                    <Typography>Коммит релиз</Typography>
                    <Typography>{data?.git.last_commit}</Typography>
                  </div>
                )}
                {!isError && (
                  <div className={classes.statusContainer}>
                    <Typography>Дата релиза</Typography>
                    <Typography>{commitDateLocalized}</Typography>
                  </div>
                )}
                {!isError && data?.git.tag && (
                  <div className={classes.statusContainer}>
                    <Typography>Версия</Typography>
                    <Typography>{data?.git.tag}</Typography>
                  </div>
                )}
              </Paper>
            </Popover>
          </div>
        </div>
      )}
    </>
  );
};
export default Header;
