import { defineStore } from "pinia";
import { ref } from "vue";

export const useSetting = defineStore("use-setting", () => {
  const settingVisible = ref(false);
  const settingOption = ref("");

  const updateSettingVisible = (visible: boolean) => {
    settingVisible.value = visible;
  };

  const updateSettingOption = (option: string) => {
    settingOption.value = option;
  };

  return {
    settingVisible,
    settingOption,
    updateSettingVisible,
    updateSettingOption,
  };
});
