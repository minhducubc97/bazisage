import type { Metadata } from "next";
import OnboardingClient from "./OnboardingClient";

export const metadata: Metadata = {
  title: "Read My Chart",
  description: "Enter your birth details to receive your personalised Bazi (Four Pillars) reading.",
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
