import { useEffect, useMemo, useState } from "react";
import Auth0 from "auth0-js";
import reactLogo from "./assets/react.svg";
import "./App.css";

const auth0 = new Auth0.WebAuth({
  domain: "dev-h13hcc3oy5qqn5sx.eu.auth0.com",
  clientID: "Mv9aM2QqJmen4EkZOLK7wqXQVTWkaa8M",
  audience: `https://dev-h13hcc3oy5qqn5sx.eu.auth0.com/api/v2/`,
  scope:
    "read:current_user update:current_user_metadata delete:current_user_metadata openid profile email",
});

function App() {
  const [userProfile, setUserProfile] = useState<Auth0.Auth0UserProfile>();
  const [accessToken, setAccessToken] = useState("");
  const [count, setCount] = useState(0);
  const [userMetadata, setUserMetadata] = useState({});

  useEffect(() => {
    auth0.parseHash({ hash: window.location.hash }, function (err, authResult) {
      if (err) {
        return console.log(err);
      }

      if (authResult?.accessToken) {
        setAccessToken(authResult?.accessToken);
        auth0.client.userInfo(authResult.accessToken, function (err, user) {
          // Now you have the user's information
          setUserProfile(user);
          window.history.replaceState(null, "", " ");
        });

        // @ts-ignore
        window.ManagementAPI = new Auth0.Management({
          domain: "dev-h13hcc3oy5qqn5sx.eu.auth0.com",
          token: authResult?.accessToken,
        });
      }
    });
  }, []);

  const ManagementApi = useMemo(() => {
    if (!accessToken) {
      return null;
    }

    return new Auth0.Management({
      domain: "dev-h13hcc3oy5qqn5sx.eu.auth0.com",
      token: accessToken,
    });
  }, [accessToken]);

  useEffect(() => {
    if (!ManagementApi || !userProfile) {
      return;
    }
    ManagementApi.getUser(userProfile?.sub, (err, result) => {
      if (err) {
        console.log("Error in getting user from Management API", err);
      }

      setUserMetadata(result.user_metadata);
    });
  }, [ManagementApi, userProfile]);

  const enableMfa = () => {
    if (ManagementApi && userProfile) {
      ManagementApi.patchUserMetadata(
        userProfile.sub,
        { use_mfa: true },
        (err, result) => {
          if (result) {
            setUserMetadata(result.user_metadata);
          }
        }
      );
    }
  };

  const disableMfa = () => {
    if (ManagementApi && userProfile) {
      ManagementApi.patchUserMetadata(
        userProfile.sub,
        { use_mfa: false },
        (err, result) => {
          if (result) {
            setUserMetadata(result.user_metadata);
          }
        }
      );
    }
  };

  const handleLogin = () => {
    auth0.authorize({
      responseType: "token id_token",
      redirectUri: "http://localhost:3000",
    });
  };

  const handleLogout = () => {
    auth0.logout({ returnTo: "http://localhost:3000" });
  };

  const renderMfaActioner = () => {
    // @ts-ignore
    const isMfaEnabled = Boolean(userMetadata.use_mfa);
    return (
      <p>
        {!isMfaEnabled && <button onClick={enableMfa}>Enable MFA</button>}
        {isMfaEnabled && <button onClick={disableMfa}>Disable MFA</button>}
      </p>
    );
  };

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        {userProfile && (
          <>
            <button onClick={() => setCount((count) => count + 1)}>
              Hi {userProfile.name}:{userProfile.user_id} count is {count}
            </button>
            {accessToken && renderMfaActioner()}
          </>
        )}
        <p>
          {!userProfile && <button onClick={handleLogin}>Login</button>}
          {userProfile && <button onClick={handleLogout}>Logout</button>}
        </p>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;
