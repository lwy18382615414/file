import type { SharedCloudContent } from "@/types/type";

export type MenuType = {
  name: string;
  path: string;
  children?: SharedCloudContent[];
};
