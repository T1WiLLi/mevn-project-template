export default function serialize<T extends { _id?: any; toJSON?: () => any; toObject?: () => any }>(
    docs: T | T[] | null | undefined
) {
    if (!docs) return docs;

    const serializeDoc = (doc: T) => {
        if (!doc) return doc;

        let obj: any = typeof doc.toObject === 'function' ? doc.toObject() : doc;

        if (typeof obj.toJSON === 'function') {
            obj = obj.toJSON();
        }

        return {
            ...obj,
            id: obj._id?.toString(),
            _id: undefined,
            __v: undefined,
            password: undefined
        };
    };

    return Array.isArray(docs) ? docs.map(serializeDoc) : serializeDoc(docs);
}
