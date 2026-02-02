module.exports = (req, res, next) => {
    const user = req.user;

    if (!user || user.role !== "admin") {
        console.log("Admin Check Failed: Role mismatch", user);
        return res.status(403).json({ message: "Admin only" });
    }

    if (user.email !== process.env.ADMIN_EMAIL) {
        console.log("Admin Check Failed: Email mismatch", { userEmail: user.email, envEmail: process.env.ADMIN_EMAIL });
        return res.status(403).json({ message: "Unauthorized admin" });
    }



    next();
};
