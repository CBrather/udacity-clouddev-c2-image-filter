import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import Joi from 'joi';
import { filterImageFromURL, deleteLocalFiles, putImageToUrl } from './util/util';

(async () => {
  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;

  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */

  app.get('/filteredimage', (req: Request, res: Response) => {
    const { image_url, putimage_url }: { image_url: string; putimage_url: string } = req.query;
    const imageUrlValidation = Joi.validate(image_url, Joi.string().uri());

    if (imageUrlValidation.error) {
      console.log(`Received invalid image_url query:\n${imageUrlValidation.error}`);
      return res.status(400).send('Did not receive a proper uri as image_url query parameter');
    }

    const putImageUrlValidation = Joi.validate(putimage_url, Joi.string().uri());

    filterImageFromURL(image_url)
      .then(async filteredImage => {
        // Try to upload the filtered image to putimage_url
        if (putimage_url && putImageUrlValidation.error) {
          console.log(`Received invalid putimage_url query, cannot put filtered image`);
        } else if (putimage_url) {
          putImageToUrl(putimage_url, filteredImage);
        }

        // return filtered image to the requester
        res.status(200).sendFile(filteredImage, err => {
          deleteLocalFiles([filteredImage]);
          if (err) {
            console.log(`Failed to send image back to client.\n
                        source path: ${image_url}\n
                        local path: ${filteredImage}`);
            res.sendStatus(500);
          }
        });
      })
      .catch(err => {
        console.log(err);
        res.sendStatus(500);
      });
  });

  // Root Endpoint
  // Displays a simple message to the user
  app.get('/', async (req, res) => {
    res.send('try GET /filteredimage?image_url={{}}');
  });

  // Start the Server
  app.listen(port, () => {
    console.log(`server running http://localhost:${port}`);
    console.log(`press CTRL+C to stop server`);
  });
})();
