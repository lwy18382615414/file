import request from "@/utils/service";
import configUrl from "@/config";

export const getConfig = () => {
  return request.request({
    url: configUrl.configApi + "/api/config/web",
    method: "get",
  });
};
