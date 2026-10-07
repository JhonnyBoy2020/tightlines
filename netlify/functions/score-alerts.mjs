import { evaluateAlerts } from "../../server/service.mjs";
import { deployment } from "../../server/deployment-context.generated.js";
export default async () => {
  if (!deployment.production) return new Response("Preview: schedule disabled");
  return Response.json(await evaluateAlerts());
};
export const config = { schedule: "15 * * * *" };
