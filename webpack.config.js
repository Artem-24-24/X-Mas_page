const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const WorkboxPlugin = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest')

const config = {
  entry: {
    app: './src/index.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'VR Session Input',
      favicon: './assets/logo.png'
    }),

    new WebpackPwaManifest({
      name: 'WebXR PWA Example',
      short_name: 'WebXRPWA',
      description: 'WebXR PWA Example for factory environment',
      // start_url: ".",
      background_color: "#fff",
      theme_color: "#4d0",
      display: "standalone",
      icons: [
        {
          src: path.resolve('src/images/android/android-launchericon-512-512.png'),
          sizes: [48, 72, 96, 144, 192, 512], // multiple sizes
          purpose: 'any'
        },
        {
          src: path.resolve('src/images/android/android-launchericon-192-192.png'),
          size: '192x192',
          purpose: 'maskable'
        }
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {from: 'node_modules/three/examples/jsm/libs/draco', to: 'draco'}
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {from: 'node_modules/@webxr-input-profiles/assets/dist/profiles', to: 'profiles'}
      ]
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|glb|ogg|mp3)$/i,
        type: 'asset/resource',
      },
    ]
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  devServer: {
    // static: {
    //   directory: path.join(__dirname, 'src/logo.png')
    // },
    compress: true,
    port: 8080
  }
};

module.exports = (env, argv) => {
  if (!env['WEBPACK_SERVE']) {
    config.plugins.push(new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      clientsClaim: true,
      skipWaiting: true,
      maximumFileSizeToCacheInBytes: 5527705
    }))
  }

  return config
}
