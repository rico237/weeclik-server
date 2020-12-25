# Changelog
All notable changes to this project will be documented in this file.        
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]
### Changed
- When charging a commerce via Stripe API, commerceId is now being passed as a parameter
- When sharing a commerce, a timer is also set on Back to prevent looping on endpoint and getting an infinite number of sharing
- Bugfixes for endpoint POST (/publish-commerce).

## [2.3.1] - 2020-12-25
### Changed
- Fix async keyword missing in /publish-commerce endpoint

## [2.3] - 2020-12-25
### Added
- Added a new endpoint POST (/publish-commerce), to publish a commerce to weeclik network via backend, much secure than writing business logic in react app

### Changed
- Update cloud function after save for commerce, now create an empty array for stripeCheckoutSession, storing stripe checkout sessions IDs to prevent fraud.

## [2.2] - 2020-11-19
### Added
- Added a new endpoint POST (/create-checkout-session), for payment checkout / CSA 3D secure integration
- Added a new endpoint POST (/retrieve-checkout-session-status), to confirm the successfull payment of a checkout sssion

### Changed
- Move someroute to different files, all routes / cron are no longer in one unique file

### Removed
- Endpoint POST (/charge) since no longer used by web app project

## [2.1] - 2020-11-08
### Changed
- Prepare MongoDB Atlas migration with removal of MONGODB_URI config var, the server app now uses DATABASE_URI config var name (not linked to Heroku's MongoDB Add-on).

## [2.0] - 2020-09-24
### Added
- New sharing Endpoint POST (/share). Needs a commerceId(required) and a userId(optional) to increment sharing number.
- After save of commerce now check if end of subscription is null, set its date tu current, so the cron task, checking for expired commerces), can invalidate it directly.

### Changed
- After save of commerce now check if it's null not only if latitude & longitude are egal to 0.
- Better handling of [Stripe](https://stripe.com/fr) payment methods (billing + others) - POST: /charge (async).
- Clean up of dependencies
- Updated npm librairies such as Parse, Dashboard, etc.

### Removed
- After save of commerce no longer check description for hashtags.
- Endpoint GET (/valid-email/:email), for checking if user email is valid, never used.
- Endpoint GET (/redirect-to-store), for getting a link to download the app, [Weeclik website](https://www.weeclik.com/) is now being used for this purpose.
- Endpoint POST (/webhook), which was used during [Stripe](https://stripe.com/fr) integration tests.

## [1.0.7] - 2020-01-12
### Added
- Add [Stripe](https://stripe.com/fr) charge method (unique payment). - POST: /charge (async).
- Cloud code function (endedSubscription) to track ended payments of commerces hourly.
- Added endpoint for universal links (iOS). - GET /apple-app-site-association.
- Added Parse Cloud AfterDelete function to remove all commerce's photos & videos if deleted.
- Prevent .DS_Store files to be tracked by Git.

### Changed
- Major update of parse-server dependency from v2 to v3.
- Parse server cron (automatic schedule) now execute new cloud code function to retrieve commerce's ended subscriptions.
- Better Parse Cloud AfterSave function.
- Added other banned word to commerce's tags ("description", "sappuie", "sur", "pour", "les", "proposer", "très").

### Removed
- Cloud code function (retrieveAllObjects) since parse-server framework changed from v2 to v3 (function no longer can be executed).

## [1.0.6] - 2019-12-01
### Changed
- Change handling of /charge endpoint.

## [1.0.5] - 2019-11-24
### Added
- Add CORS domain origin option on POST (/charge).

## [1.0.4] - 2019-11-16
### Added
- Created CHANGELOG.md file to keep track of changes.

## [1.0.3] - 2019-11-16
### Added
- Increase max file upload size to 1Go. 

## [1.0.2] - 2019-07-14
### Removed
- Removed Javascript key from Parse Server configuration (No longer needed).