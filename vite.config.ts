import path from "node:path";
import { VantResolver } from "@vant/auto-import-resolver";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import basicSsl from "@vitejs/plugin-basic-ssl";
import postcssPxToRem from "postcss-pxtorem";
import { viteVConsole } from "vite-plugin-vconsole";
import legacy from "@vitejs/plugin-legacy";
import vitePluginZipDist from "vite-plugin-dist-zip";
import { name } from "./package.json";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDevLike = mode === "development" || mode === "production";

  const iconDir = path.resolve(process.cwd(), "src/assets/icons");

  const plugins = [
    vue(),
    AutoImport({
      resolvers: [VantResolver(), ElementPlusResolver()],
    }),
    Components({
      resolvers: [VantResolver({ importStyle: false }), ElementPlusResolver()],
    }),
    tailwindcss(),
    createSvgIconsPlugin({
      iconDirs: [iconDir],
      symbolId: "icon-[dir]-[name]",
    }),
    vitePluginZipDist({ zipName: `${name}-${mode}` }),
    // basicSsl(),
    legacy({
      targets: [
        "defaults",
        "Chrome >= 49",
        "Safari >= 10",
        "iOS >= 10",
        "Android >= 5",
      ],
      // 需要的 polyfill
      additionalLegacyPolyfills: [
        "core-js/stable",
        "regenerator-runtime/runtime",
      ],
      // 生成的 legacy bundle 会自动插入到 HTML
      renderLegacyChunks: true,
    }),
  ];

  if (isDevLike) {
    plugins.push(
      viteVConsole({
        entry: path.resolve("src/main.ts"), // 默认会自动注入 main.ts，也可以指定其他入口
        enabled: isDevLike,
        config: {
          maxLogNumber: 1000,
          theme: "light",
        },
      }),
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    css: {
      postcss: {
        plugins: [
          postcssPxToRem({
            rootValue: 16, // 根元素字体大小，通常为 16px
            unitPrecision: 5, // 转换后的精度，即小数点后保留的位数
            propList: ["*"], // 所有属性都进行转换，支持数组、正则等方式
            selectorBlackList: [".no-rem"], // 排除不进行转换的类名
            replace: true, // 是否直接替换（默认为 true）
            mediaQuery: false, // 是否转换媒体查询中的 px（默认为 false）
            minPixelValue: 4, // 小于 1px 的值不进行转换
          }),
        ],
      },
    },
    server: {
      host: "0.0.0.0",
      port: 8088,
    },
    base: mode === "production" ? "/CloudH5/" : "",
    build: {
      outDir: "dist", //指定输出文件
      assetsDir: "./", //指定生成静态文件目录
      sourcemap: false,
      minify: "terser", // 启用 terser 压缩
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`,
        },
      },
      terserOptions: {
        compress: {
          drop_console: false, // 删除所有 console
          drop_debugger: true, // 删除 debugger
        },
      },
    },
  };
});
