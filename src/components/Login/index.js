import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Message } from 'semantic-ui-react';

import './Login.css';

@inject('gpdStore')
@observer
class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: null,
      password: null,
    };
  }

  logIn = e => {
    e.preventDefault();
    const { username, password } = this.state;
    this.props.gpdStore.doLogin(username, password);

    //submit login here
  };

  onInputChange = e => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
  };

  render() {
    const { showLoginError } = this.props.gpdStore;

    return (
      <div className="page page-login bg-image">
        <div className="content-box">
          <h1 className="heading-1">CLASSIFICATION App</h1>
          <label className="header">Please log in:</label>
          {showLoginError && (
            <Message negative>
              <Message.Header>Incorrect credentials</Message.Header>
              <p>Please input the correct username and password and try again.</p>
            </Message>
          )}

          <form autoComplete="on" onSubmit={this.logIn}>
            <div className="login-input-field">
              <label className="login-input-label" />
              <input
                className="login-input"
                name="username"
                type="text"
                placeholder="Username"
                onChange={this.onInputChange}
                autoFocus
              />
            </div>
            <div className="login-input-field">
              <label className="login-input-label" />
              <input
                className="login-input"
                name="password"
                type="password"
                placeholder="Password"
                onChange={this.onInputChange}
              />
            </div>
            <div className="login-submit-container">
              <input type="submit" value="Log in" className="login-submit" />
            </div>
          </form>

          <label className="header">or create a new account:</label>
          <div className="new-account-field">
            <label className="new-account-label">
              <a href="http://www.geopedia.world/">new Geopedia account +</a>
            </label>
          </div>
          <div className="logos">
            <div className="logo-EOR">
              <img src="./eor-black.svg" />
            </div>
            <div>
              <img src="./sentinel_hub_by_sinergise_logo_black.png" className="logo-SH" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Login;
