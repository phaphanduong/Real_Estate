package com.origincatcher;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.bebnev.RNUserAgentPackage;
import com.levelasquez.androidopensettings.AndroidOpenSettingsPackage;
import io.sentry.RNSentryPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNUserAgentPackage(),
            new AndroidOpenSettingsPackage(),
            new RNSentryPackage(),
            new RNGestureHandlerPackage(),
            new RandomBytesPackage(),
            new ReactNativePushNotificationPackage(),
            new RNCWebViewPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
