# Accessport2LtpTranslator

### Purpose
- The Accessport2LtpTranslator is supporting e.g. the Resolver in creating a valid RESTCONF URI. 
- It is translating the access port identified from within x:akta plus a given protocol layer name into the UUID of an LTP, which is associated with the corresponding Connector object on the ONF interface. **Update on 30th of September 2022**: During ApplicationOwner call, it has been discussed to return [LtpUuid, LayerProtocolName, Clients, Server] of the entire stack of LTPs on top of a physical connector. 
- Accessport2LtpTranslator is continuously going through the MicroWaveDeviceInventory and updating its internal translation table. **Update on 30th of September 2022**: It has been decided not to maintain an internal data store of translation results, but to calculate them on demand.
- Concrete translation results are provided on individual service requests.
- Potential format of the response 
````
  {
    [
      {
        ownUuid,
        layerProtocolName,
        clientLtpUuid [ ],
        serverLtpUuid [ ],
      }
    ]
  }
````

### ApplicationOwner
- Thomas Seitz
- [Roadmap to Specification](../../issues/1)

### Services
- [Accessport2LtpTranslator+services](./Accessport2LtpTranslator+services.yaml)

### Profiles
- [Accessport2LtpTranslator+profiles](./Accessport2LtpTranslator+profiles.yaml)

### Forwardings
- [Accessport2LtpTranslator+forwardings](./Accessport2LtpTranslator+forwardings.yaml)

### Open API specification (Swagger)
- [Accessport2LtpTranslator+oas](./Accessport2LtpTranslator+oas.yaml)

### LOADfile
- to be provided

### Test Cases (Postman Export) and DATAfile
- [Accessport2LtpTranslator+data](./Accessport2LtpTranslator+data.json)

### Publication
- No official publication planned

### Classification
- Live Network
- High Performance Network Interface

### Open Issue List
- [Accessport2LtpTranslator/issues](../../issues)

### Comments
This application will be specified within the training for ApplicationOwners.
