import { onboarding } from "@/lib/onboarding/server";

export const POST = (request: Request) => onboarding.confirmCode(request);
