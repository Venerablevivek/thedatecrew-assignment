import { route } from "@/lib/api";
import { getClient } from "@/lib/data";
export const GET = route(async (req, { params }) => ({
  client: await getClient((await params).id),
}));
