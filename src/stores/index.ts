import { createPinia } from "pinia";
import persist from "pinia-plugin-persistedstate";

const pinia = createPinia();

pinia.use(persist);

export default pinia;
export * from "./modules/upload";
export * from "./modules/viewMode";
export * from "./modules/uploadStatus";
export * from "./modules/setting";
export * from "./modules/pageUtils";
export * from "./modules/shareFile";
export * from "./modules/routeStack";
