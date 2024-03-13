# Accessport2LtpTranslator Specification

In order to compare planning data and system settings as well as performance data, it should be possible to establish standardised relationships between the SDN models and current planning tools.  
Therefore the attribute sequenceID should be used.  
Each object (connector and contained-holder) beneath an common equipment object should have a unique sequenceId.  
Accessport2LtpTranslator is translating the given sequenceId values (for instance from a legacy tool like x:akta or APT) into the UUID of an LTP.

The relevant data is collected on demand when the requestor is calling the /v1/translate-equipment-sequence-ids-to-ltp-uuids.  
The input parameters should be handed over via request body.  
The data is retrieved from the MicrowaveDeviceInventory from cache.  
Concrete translation results are provided on individual service requests.  

### Example of the response

```
{access-port-to-ltp-mappings:
  [
    {
      uuid: "ETY-2134639620",
      client-ltp: ["PES-21346039620"],
      server-ltp: [],
      layer-protocol-name : ["wire-interface-2-0…",…]
    },
    {
      uuid: "PES-2134639620",
      client-ltp: ["ETH-2134639620"],
      server-ltp: ["ETY-2134639620"],
      layer-protocol-name: ["pure-ethernet-structure-2-0:…",…]
    }
    {
      uuid:"ETH-2134639620",
      client-ltp:["MAC-2134639620"],
      server-ltp: ["PES-2134639620"],
      layer-protocol-name : ["ethernet-container-2-0…",…]
    },
    {
      uuid:"MAC-2134639620",
      client-ltp:["VI-4"],
      server-ltp: ["ETH-2134639620"],
      layer-protocol-name: ["mac-interface-1-0:…",…]
    },
    {
      uuid: "VI-4",
      client-ltp: [],
      server-ltp: ["MAC-2134639620"],
      layer-protocol-name: ["vlan-interface-1-0:…",…]
    },
  ]
}
```

### ServiceList
- [Accessport2LtpTranslator+services](./Accessport2LtpTranslator+services.yaml)

### ProfileList and ProfileInstanceList
- [Accessport2LtpTranslator+profiles](./Accessport2LtpTranslator+profiles.yaml)
- [Accessport2LtpTranslator+profileInstances](./Accessport2LtpTranslator+profileInstances.yaml)

### ForwardingList
- [Accessport2LtpTranslator+forwardings](./Accessport2LtpTranslator+forwardings.yaml)

### Open API specification (Swagger)
- [Accessport2LtpTranslator](./Accessport2LtpTranslator.yaml)

### CONFIGfile (JSON)
- [Accessport2LtpTranslator+config](./Accessport2LtpTranslator+config.json)

### Comments
./.
