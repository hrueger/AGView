export function reduceFraction(numerator, denominator) {
    for (let i = numerator; i > 0; i--) {
        if (!(numerator % i) && !(denominator % i)) {
            return [(numerator / i), (denominator / i)];
        }
    }
    return [numerator, denominator];
}
