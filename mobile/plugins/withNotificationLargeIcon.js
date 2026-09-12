/**
 * Puts the full-colour Quotahire logo on Android notifications.
 *
 * Android draws two icons on a notification. The small one, in the status bar,
 * is forced to a flat silhouette — every pixel with alpha is painted white and
 * the source colours are thrown away — which is why the expo-notifications docs
 * require that image to be "a 96x96 all-white png with transparency". No colour
 * logo can ever appear there; that slot is handled by
 * assets/images/notification-icon.png.
 *
 * The large icon, shown at the right-hand side of the notification, is drawn as
 * an ordinary bitmap with its colours intact. That is where the real logo goes.
 *
 * expo-notifications reads it from an application meta-data key:
 *
 *   expo.modules.notifications.large_notification_icon
 *
 * (ExpoNotificationBuilder.META_DATA_LARGE_ICON_KEY — the builder calls
 * BitmapFactory.decodeResource on whatever resource id it finds, then
 * NotificationCompat.Builder.setLargeIcon with the result.)
 *
 * The bundled config plugin does not write that key yet; its source carries a
 * "TODO add config for local notification large icon" where it would go. This
 * plugin writes it, and copies the bitmap into the Android resources so there
 * is something for the id to point at.
 *
 * If a future SDK stops reading the key, the native side falls back to no large
 * icon at all — the notification still arrives, just without the logo beside
 * it. It is wrapped in a try/catch there, so nothing can crash on it.
 */

const fs = require('fs');
const path = require('path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const META_DATA_LARGE_ICON_KEY = 'expo.modules.notifications.large_notification_icon';

/** Resource name, so the manifest can refer to @drawable/<this>. */
const RESOURCE_NAME = 'notification_large_icon';

/**
 * The source bitmap, relative to the project root. 256px, which is 64dp at
 * xxxhdpi — the size Android draws a large icon at on the densest screens.
 */
const SOURCE = path.join('assets', 'images', 'notification-large-icon.png');

/** Densest bucket, so Android scales the one file down for other screens. */
const RES_DIR = path.join('android', 'app', 'src', 'main', 'res', 'drawable-xxxhdpi');

const withLargeIconAsset = (config) =>
  withDangerousMod(config, [
    'android',
    async (config) => {
      const { projectRoot } = config.modRequest;
      const source = path.join(projectRoot, SOURCE);

      if (!fs.existsSync(source)) {
        throw new Error(
          `withNotificationLargeIcon: ${SOURCE} is missing. Android notifications ` +
            'would build without a logo, so this is a hard failure rather than a warning.',
        );
      }

      const targetDir = path.join(projectRoot, RES_DIR);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.copyFileSync(source, path.join(targetDir, `${RESOURCE_NAME}.png`));

      return config;
    },
  ]);

const withLargeIconManifest = (config) =>
  withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      META_DATA_LARGE_ICON_KEY,
      `@drawable/${RESOURCE_NAME}`,
      'resource',
    );
    return config;
  });

module.exports = (config) => withLargeIconManifest(withLargeIconAsset(config));
