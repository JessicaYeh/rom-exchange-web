import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Route, BrowserRouter } from 'react-router-dom';
// import * as firebase from 'firebase/app';
// import 'firebase/auth';
// import 'firebase/firestore';

import App from './app';
import './index.scss';

// TODO: Firebase will be used for authentication, when implementing dashboard feature
// firebase.initializeApp(config);
// firebase.firestore().settings({ timestampsInSnapshots: true });

ReactDOM.render(
  <BrowserRouter>
    <Route path='/' component={App} />
  </BrowserRouter>,
  document.getElementById('root') as HTMLElement
);
