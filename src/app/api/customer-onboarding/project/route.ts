import { onboarding } from "@/lib/onboarding/server";

export const GET = (request: Request) => onboarding.project(request);
