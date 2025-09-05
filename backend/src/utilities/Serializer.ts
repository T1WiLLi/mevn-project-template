export default function serialize<T extends { _id?: any; toJSON?: () => any }>(
    docs: T | T[]
) {
    const serializeDoc = (doc: T) => {
        const obj = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
        return {
            ...obj,
            id: obj._id?.toString(),
            _id: undefined,
        };
    };

    if (Array.isArray(docs)) {
        return docs.map(serializeDoc);
    }
    return serializeDoc(docs);
}
