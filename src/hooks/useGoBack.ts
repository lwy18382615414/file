import { ref } from "vue";
import { useRouter } from "vue-router";
import { appGoBack } from "@/utils";

const needGoBackApp = ref(false);
const isApp = ref(false); // 是否从app点进来
const isHideBack = ref(false); // pc是否显示返回按钮

const useGoBack = () => {
  const router = useRouter();
  const goBack = (backtype: number = -1, name = "", type = "") => {
    if (needGoBackApp.value) {
      // 桌面端关闭窗口方法  不能删！！！！！！！！！！！！！
      console.log(JSON.stringify({ type: "6" }));
      appGoBack();
    } else if (name) {
      if (type === "push") {
        router.push({
          name,
        });
      } else {
        router.replace({
          name,
        });
      }
    } else {
      router.go(backtype);
    }
  };

  return {
    needGoBackApp,
    isApp,
    isHideBack,
    goBack,
  };
};

export default useGoBack;
