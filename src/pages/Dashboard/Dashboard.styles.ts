import makeStyles from '@mui/styles/makeStyles';


const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  title: {
    flexGrow: 1,
  },
  errorDate: {
    position: 'absolute',
    bottom: '-35px',
    color: 'red',
    right: 0,
  },
  picker: {
    display: 'flex',
    gap: 20,
    alignItems: 'center',
    position: 'relative',
  },
  buttonText: {
    fontSize: '0.8rem',
  },

  errorDateHidden: {
    display: 'none',
    visibility: 'hidden',
  },
  pickerContainer: {
    display: 'flex',
    marginBottom: 30,
    gap: 30,
  },
  formContainer: {
    display: 'flex',
    marginTop: 'auto',
    gap: '20px',
    '& .MuiTextField-root': {},
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'black',
    },
    position: 'relative',
    alignItems: 'center',
  },
  button: {
    color: 'white',
    background: theme.palette.secondary.main,
    minHeight: 56,
  },
  content: {
    flexGrow: 1,
    height: '100%',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'hidden',
    flexDirection: 'column',
    height: '100%',
    '& .recharts-responsive-container': {
      '& .recharts-wrapper': {
        '& g.yAxis:nth-of-type(3)': {
          transform: 'translate(CALC(100% - 100PX), 0px) ',
          '& .recharts-layer.recharts-cartesian-axis-tick': {
            
              transform: 'translate(15PX, 0px) ',
              '& line': {
                    transform: 'translate(-18px, 0)'
              },

              '& text': {
                textAnchor: 'start'
              }
          },
        },
      },
    },
  },
  paperUsers: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'hidden',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between',
  },
  fixedHeight: {
    minHeight: 240,
  },
}));

export default useStyles;
