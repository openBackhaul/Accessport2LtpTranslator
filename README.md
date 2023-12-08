# Accessport2LtpTranslator  

### Location  
The Accessport2LtpTranslator (A2LT) is part of the HighPerformanceNetworkInterface.

### Description  
It is supporting other applications or legacy tools in creating valid RESTCONF URIs.  
The A2LT is translating port identifiers as they are prevalent in the planning tools into UUIDs of LogicalTerminationPoints as they are used on the harmonized management interface.

### Relevance
The Accessport2LtpTranslator serves as a "phone book". 
Other applications require it for addressing live network resources.

### Resources
- [Specification](./spec/)
- [TestSuite](./testing/)
- [Implementation](./server/)

### Dependencies
- [MicroWaveDeviceInventory](https://github.com/openBackhaul/MicroWaveDeviceInventory)
- The sequence-id attribute needs to be supported by the vendors.

### Comments
./.
