# AEM Mobile Sandbox

Some hacky scripts to utilize AEM Mobile's API

#### This really is quite hacky stuff. You should understand the code or have talked to me before running this stuff. Otherwise, I'm not responsible if your articles and collections get all messed up. :^)

## Getting Started

#### Requirements

* node
* npm

#### Installing

* Clone this repository
* Run `npm install`
* Copy `api.json.dist` to `api.json`
* Edit `api.json` with the proper values. You may obtain a device_id and device_secret [here](https://aex.publish.adobe.com/index.html#/).
* Now you can run scripts with node. E.g. `node copyLayouts.js`
* _Note: Some files may require additional editing. For example, copyLayouts.js requires a `DEST_PUBLICATION_ID`._

