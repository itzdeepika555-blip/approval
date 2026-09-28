import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(` Industrial Approval, Compliance & Support Navigator`);
  console.log(` Government of Maharashtra | SIH Problem: SIH26130 `);
  console.log(`====================================================`);
  console.log(` Backend Server running on port : ${config.port}`);
  console.log(` Environment                   : ${config.nodeEnv}`);
  console.log(` API Root Prefix               : ${config.apiPrefix}`);
  console.log(` Allowed Frontend Origin       : ${config.clientOrigin}`);
  console.log(`====================================================`);
});
