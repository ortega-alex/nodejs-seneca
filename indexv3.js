const seneca = require("seneca");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const service = seneca();

service.add("role:upload,image:*,data:*", function (msg, next) {
    let filename = path.join(__dirname, "uploads", msg.image);
    let data = Buffer.from(msg.data, "base64");

    fs.writeFile(filename, data, (err) => {
        if (err) return next(err);

        return next(null, { size: data.length });
    });
});

service.add("role:check,image:*", function (msg, next) {
    let filename = path.join(__dirname, "uploads", msg.image);

    fs.access(filename, fs.constants.R_OK, (err) => {
        return next(null, { exists: !err });
    });
});

service.add("role:download,image:*", function (msg, next) {
    let filename = path.join(__dirname, "uploads", msg.image);

    fs.access(filename, fs.constants.R_OK, (err) => {
        if (err) return next(err);

        let image = sharp(filename);
        let width = +msg.width;
        let height = +msg.height;
        let blur = +msg.blur;
        let sharpen = +msg.sharpen;
        let greyscale = !!msg.greyscale;
        let flip = !!msg.flip;
        let flop = !!msg.flop;

        if (width > 0 && height > 0) {
            image.ignoreAspectRatio();
        }
        if (width > 0 || height > 0) {
            image.resize(width || null, height || null);
        }
        if (flip) image.flip();
        if (flop) image.flop();
        if (blur > 0) image.blur(blur);
        if (sharpen > 0) image.sharpen(sharpen);
        if (greyscale) image.greyscale();

        image.toBuffer().then((data) => {
            return next(null, { data: data.toString("base64") });
        });
    });
});

service.listen(3000);

/*
curl -H "Content-Type: application/json" --data '{"role":"upload","image":"microhydra.png","data":"'"$( base64 microhydra.png)"'"}' http://localhost:3000/act

curl -H "Content-Type: application/json" \
--data '{"role":"check","image":"microhydra.png"}' \
http://localhost:3000/act

curl -H "Content-Type: application/json" \
--data '{"role":"download","image":"microhydra.png","greyscale":true,"height":100}' \
http://localhost:3000/act | jq -r '.data' | base64 --decode > microhydra2.png

curl -H "Content-Type: application/json" --data '{"role":"download","image":"microhydra3.png","flip":true}' http://localhost:3000/act | jq -r '.data' | microhydra3.png >
*/