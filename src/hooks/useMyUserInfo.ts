import { getUserInfoApi, getUserInfoAuth } from '@/api/common'
import {
  getUserInfoSession,
  setUserInfoSession,
} from "@/utils/userInfoSession";
import { setToken } from '@/utils/auth.ts'

const useMyUserInfo = () => {

  const getMyInfoByApi = () => {
    return new Promise((resolve, reject) => {
      const userInfo = getUserInfoSession();

      if (userInfo) {
        try {
          resolve(null);
        } catch (e) {
          reject(e);
        }
      } else {
        getUserInfoApi().then((res) => {
          if (res.code === 1) {
            setUserInfoSession(res.data);
            resolve(null);
          }
          reject();
        });
      }
    });
  };

  const getMyInfoByAuth = (auth: string, tenantId: number) => {
    return new Promise((resolve, reject) => {
      getUserInfoAuth(auth, tenantId).then(res => {
        if (res.code !== 1) {
          reject();
        }
        setToken(res.data.token)
        resolve(null)
      }).catch(e => {
        reject(e);
      })
    })
  }

  return {
    getMyInfoByApi,
    getMyInfoByAuth
  };
};

export default useMyUserInfo;
