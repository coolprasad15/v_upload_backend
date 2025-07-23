const asyncHandler = (requerstHandler) => {
    (req, res, next) => {
        Promise.resolve(requerstHandler(req, res, next))
        .catch((err) => next(err));
    }
}

export { asyncHandler }