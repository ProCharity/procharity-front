import React from 'react';
import ru from 'date-fns/locale/ru';
import { isValid, parseISO, format } from 'date-fns';
import Typography from '@mui/material/Typography';
import useStyles from './Users.styles';


interface IUsersProps {
  text: number;
  title: string;
  lastUpdate?:string;
}
const Users: React.FC<IUsersProps> = ({ text, title, lastUpdate = '' }) => {
  const classes = useStyles();

  return (
    <>
      <Typography component="p" variant="h5">
        {text}
      </Typography>
      <Typography component="p" variant="h6">
        {title}
      </Typography>
      {lastUpdate && (
        <div>
          <Typography variant="body1" className={classes.depositContext}>
            Последнее обновление заданий
          </Typography>
          <Typography variant="body1" className={classes.depositContext}>
            {isValid(parseISO(lastUpdate)) ? format(parseISO(lastUpdate), 'dd.MM.yyyy, hh:mm:ss', { locale: ru }) : ''}
          </Typography>
        </div>
      )}
      <div />
    </>
  );
};

export default Users;
