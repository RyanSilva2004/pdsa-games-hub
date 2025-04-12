export const getTestMessage = (req, res) => {
  res
    .status(200)
    .json({ message: "Backend is working for Travelling salesman!" });
};
