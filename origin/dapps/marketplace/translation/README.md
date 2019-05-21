# Translation

In the DApp we use the [FBT](https://github.com/facebookincubator/fbt) localization framework from Facebook. See their [documentation](https://facebookincubator.github.io/fbt/docs/api_intro).

## Wrapping text

All user-facing English text needs to be wrapped in `<fbt>` tags. For example:

    <div className="help">
      <fbt desc="EnableMessaging.congrats">
        Congratulations! You can now message other users on Origin and stay up
        to date with all your purchases and sales.
      </fbt>
    </div>

For variables, use `<fbt:param>`. For example:

	<fbt desc="footer.usingOriginBetaOn">
	  You are currently using the Origin Beta on:
	  <fbt:param name="networkName">
	    {networkName}
	  </fbt:param>.
	</fbt>

For tag properties, e.g. `tooltip`, use the `fbt()` javascript function. Like this:

	<Tooltip
	  tooltip={fbt(
	    'Twitter Account Verified',
	    'Twitter Account Verified'
	  )}
	  placement="bottom"
	>

It is important to wrap _entire sentances_ that can be translated. That is, do not break a sentance across multiple `<fbt>` tags. This is important because words go in different orders in different languages, and in any case the translators will not know which fragments are meant to be together.

NOTE: We do not yet have localization of dates, times, and numbers. This would be a great project for someone.

## Translating

We use [Crowdin](https://crowdin.com/project/originprotocol) to allow the communtity to contribute translations. Github integration is managed by the `OriginProtocol` user, owned by Coleman.

## Integrating Translations

Translations are updated by running `npm run translate` in the `marketplace` directory.

It performs the following steps:

### Extract strings to be translated

1. **`npm run fbt:manifest`** : Generate fbt enum manifests and source manifests that indicate which files need to be translated (`.src_manifest.json` and `.enum_manifest.json`)
1. **`npm run fbt:collect`** : Collects translatable strings from throughout the app. Outputs to `.source_strings.json`
1. **`node scripts/fbtToCrowdin.js`** : Converts `.source_strings.json` to simple key-value json stored at `./translation/crowdin/all-messages.json`
1. Crowdin automatically reads [`./translation/crowdin/all-messages.json`](https://github.com/OriginProtocol/origin/blob/master/dapps/marketplace/translation/crowdin/all-messages.json) from `master` branch.

### Import translated strings into DApp to be used
1. _Translators do their magic_
1. Crowdin will (within 10 minutes) update branch [crowdin](https://github.com/OriginProtocol/origin/tree/crowdin) and create a pull request updating locale-specifc files in `./translation/crowdin/all-messages_<locale>.js`
1. **`node scripts/crowdinToFbt.js`** : Converts simple key-value back into fbt json format, stored in `./translation/fbt/<locale>.js` (Note: If we someday want to use advanced fbt features like handling [plurals](https://facebookincubator.github.io/fbt/docs/plurals) and genders, we will need to make this script smarter.)
1. **`npm run fbt:translate`** : Using the translations in `./translation/fbt/<locale>.json`, outputs combined file to `.translated_fbts.json`. (This file could be used by other non-web applications, but we only use it as intermediate file.)
1. **`node scripts/splitTranslations.js`** : Using `.translated_fbts.json`, outputs locale-specific translations in a react-friendly format to `./public/translations`
1. **`cp .enum_manifest.json translations/.enum_manifest.json`** : Copy [enums](https://facebookincubator.github.io/fbt/docs/enums#shared-enums) into same dir, as they are required at runtime.
1. DApp uses the translations in `./public/translations` at runtime.

Run all in terminal as:

    npm run fbt:manifest
    npm run fbt:collect
    node scripts/fbtToCrowdin.js
    # Do translations here
    node scripts/crowdinToFbt.js
    npm run fbt:translate
    node scripts/splitTranslations
    cp .enum_manifest.json translations/.enum_manifest.json

The pipeline then looks like this:

`./.source_strings.json` → `./trasnlation/crowdin/all-messages.json` → _Translation Occurs_ → `./trasnlation/crowdin/all-messages_<locale>.js` → `./trasnlation/fbt/<locale>.js` → `.translated_fbts.json` → `./public/translations`

For proofreading which strings have been wrapped, you can use **`npm run translate:proof`**. This will indicate wrapped strings by putting arrows around them, ◀Like This▶. It will appear thus:

![image](https://user-images.githubusercontent.com/673455/55511500-02f30780-561e-11e9-9b8d-2dac187658f1.png)





