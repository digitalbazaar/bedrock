var forge = require('node-forge');

console.log('Generating 2048-bit key-pair...');
var keys = forge.pki.rsa.generateKeyPair(2048);
console.log('Key-pair created.');

console.log('Creating self-signed certificate...');
var cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '00' + forge.util.bytesToHex(forge.random.getBytesSync(19));
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 20);
var attrs = [{
  name: 'commonName',
  value: 'bedrock.dev'
}, {
  name: 'countryName',
  value: 'US'
}, {
  shortName: 'ST',
  value: 'Virginia'
}, {
  name: 'localityName',
  value: 'Blacksburg'
}, {
  name: 'organizationName',
  value: 'Digital Bazaar'
}, {
  shortName: 'OU',
  value: 'Bedrock Development'
}];
cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.setExtensions([{
  name: 'subjectKeyIdentifier'
}, {
  name: 'basicConstraints',
  cA: true
}]);

// self-sign certificate
cert.sign(keys.privateKey/*, forge.md.sha256.create()*/);
console.log('Certificate created.');

// PEM-format keys and cert
var pem = {
  privateKey: forge.pki.privateKeyToPem(keys.privateKey),
  publicKey: forge.pki.publicKeyToPem(keys.publicKey),
  certificate: forge.pki.certificateToPem(cert)
};

console.log('\nKey-Pair:');
console.log(pem.privateKey);
console.log(pem.publicKey);

console.log('\nCertificate:');
console.log(pem.certificate);

// verify certificate
var caStore = forge.pki.createCaStore();
caStore.addCertificate(cert);
try {
  forge.pki.verifyCertificateChain(caStore, [cert],
    function(vfd, depth, chain) {
      if(vfd === true) {
        console.log('SubjectKeyIdentifier verified: ' +
          cert.verifySubjectKeyIdentifier());
        console.log('Certificate verified.');
      }
      return true;
  });
} catch(ex) {
  console.log('Certificate verification failure: ' +
    JSON.stringify(ex, null, 2));
}
