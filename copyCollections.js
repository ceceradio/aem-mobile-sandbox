var AEMMobileAPI = require('aem-mobile-api')
var q = require('q')
var _ = require('lodash')
var options = require('./api.json')
var src_publication_id = options.publication_id;
var dest_publication_id = "dest_publication_id"; // change this
var dpsUtils = new AEMMobileAPI(options);
var dpsUtils2 = new AEMMobileAPI(JSON.parse(JSON.stringify(options)));
var rootCollectionName = "topLevelContent"; // change this if necessary
var fs = require('fs');
dpsUtils2.credentials.publication_id = dest_publication_id;

var allCollections = [];
if (typeof options.access_token === 'undefined') {
  dpsUtils.getAccessToken()
  .then(function(data) {
    dpsUtils.credentials.access_token = data.access_token;
    return dpsUtils2.getAccessToken()
  })
  .then(function(data) {
    dpsUtils2.credentials.access_token = data.access_token;
    return getTree(rootCollectionName);
  })
  .then(function(tree) {
    console.log('tree received');
    return copyCollection(tree);
  })
  .then(function(copyResults) {
    console.log('done');
  })
  .catch(function(err) {
    console.log(err.stack);
    console.log(err.response);
    console.log(err.data);
  });
}

function stripPublicationAndVersion(input) {
  input = input.replace("/publication/"+src_publication_id+"/","");
  return input.substring(0, input.indexOf(";"));
}

function getTree(rootName) {
  console.log('getting '+rootName)
  var collection;
  return dpsUtils.getCollection(rootName)
  .then(function(data) {
    collection = data;
    return dpsUtils.getCollectionElements(collection)
  })
  .then(function(contentElements) {
    collection._contentIds = contentElements.map(function(contentElement) {
      return stripPublicationAndVersion(contentElement.href);
    });
    var collectionNames = getOnlyCollectionNames(contentElements);
    return q.all(collectionNames.map(function(collectionName) {
      return getTree(collectionName);
    }));
  })
  .then(function(collections) {
    collection._children = collections;
    return collection;
  })
}

function getOnlyCollectionNames(contentElements) {
  var collections = []
  for(var i in contentElements) {
    var collectionName = contentElements[i].href;
    if (collectionName.indexOf('collection/') == -1)
      continue;
    collectionName = stripPublicationAndVersion(collectionName).replace('collection/',"");
    collections.push(collectionName);
  }
  return collections;
}

function copyCollection(collection) {
  var realChildren;
  return q.all(collection._children.map(function(child) {
    return copyCollection(child);
  }))
  .then(function(children) {
    realChildren = children;

    return [
      dpsUtils2.publicationGet(stripPublicationAndVersion(collection._links.layout.href)), 
      dpsUtils2.publicationGet('collection/'+collection.entityName)
    ]
  })
  .spread(function(layout, existingCollection) {
    var copy = patchCollection(collection);
    if (typeof existingCollection.code === "undefined") {
      copy = _.merge(existingCollection, copy);
    }
    // set the layout for the copied collection to the matching layout name in the destination project
    if (typeof layout.code === "undefined") {
      copy._links.layout.href = '/publication/'+dpsUtils2.credentials.publication_id+'/layout/'+layout.entityName+";version="+layout.version;
    }
    return dpsUtils2.putEntity(copy);
  })
  .then(function(copiedCollection) {
    return dpsUtils2.addEntitiesToCollection(collection._contentIds, copiedCollection.entityName)
  })
}

function patchCollection(collectionObject) {
  return {
    "readingPosition": collectionObject.readingPosition,
    "productIds": collectionObject.productIds,
    "allowDownload": collectionObject.allowDownload,
    "openTo": collectionObject.openTo,
    "lateralNavigation": collectionObject.lateralNavigation,
    "title": collectionObject.title,
    "importance": collectionObject.importance,
    "isIssue": collectionObject.isIssue,
    "entityName": collectionObject.entityName,
    "entityType": "collection"
  }
}
