import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-southeast-1_zGjdn5K3U",
      userPoolClientId: "1t1vqiu4fdpr2eagd84q63ip5a",
      loginWith: {
        email: true,
      },
    },
  },
});