// 公共类型定义文件

// 定义接口返回数据类型
import type { AxiosResponse } from "axios";

export interface IResponse<T> {
  code: number;
  data: T;
  timeStamp?: number;
  message?: string;
}

export type ApiResponse<T> = AxiosResponse<IResponse<T>>;
