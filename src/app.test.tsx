import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';

// TODO: figure out how to mock firebase or setup test firebase instance so this can work
it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});
