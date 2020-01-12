# Changelog
All notable changes to this project will be documented in this file.        
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]
### Changed
- Better handling of [Stripe](https://stripe.com/fr) payment methods (billing + others) - POST: /charge (async).

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