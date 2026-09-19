import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;

/* ✅ FORCE BREVO HOST */
client.basePath = "https://api.brevo.com/v3";

const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

export const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
