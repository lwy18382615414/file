import { ref } from "vue";

export const useLogin = () => {
  const isAccountLogin = ref(false);
  const loginData = ref<any>({
    loginAccount: "",
    loginPassword: "",
    areaCode: "86",
    loginType: 2,
  });

  const toAccountLogin = () => {
    isAccountLogin.value = !isAccountLogin.value;
  };

  return { isAccountLogin, toAccountLogin, loginData };
};
