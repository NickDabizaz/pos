export type EmailMessage = {
  to     : string;
  subject: string;
  html   : string;
};

export type Mailer = {
  send(message: EmailMessage): Promise<void>;
};
