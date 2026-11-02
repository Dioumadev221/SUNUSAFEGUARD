// Les icônes n'ont pas d'intérêt dans les tests de logique : chaque icône devient un composant vide.
module.exports = new Proxy({}, { get: () => () => null });
