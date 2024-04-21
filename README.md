# Online Store Web Application

This is a web application representing an online store, developed using Node.js, Express.js, MongoDB, and other technologies. The application allows users to browse, add, and manage products, as well as make purchases.

## Installation

1. Clone the repository to your local machine:

```
git clone https://github.com/zhanarys000/web-final
```

2. Install dependencies:

```
npm install
```

3. Start the application:

```
nodemon index.js
```

The application will be available at http://localhost:3000/.

## Usage

- Visit the home page to browse available products.
- To add a product to the cart, click on the "Add to Cart" button on the product page.
- To place an order, go to the cart and click the "Checkout" button.

## Technologies

- Node.js
- Express.js
- MongoDB
- EJS (Embedded JavaScript)
- Multer (for image upload)
- Axios (for HTTP requests)
- bcryptjs (for password hashing)
- express-session (for session management)


## Admin Info
- username: zhanarys
- email: zhanarys@gmail.com
- password: zhanarysasan

## Endpoints

- \`GET /products\`: Get a list of all products.
- \`GET /products/:productId\`: Get information about a product by its ID.
- \`POST /products\`: Create a new product.
- \`PUT /products/:productId\`: Update information about a product.
- \`DELETE /products/:productId\`: Delete a product.

- \`GET /cart\`: Get the contents of the user's cart.
- \`POST /cart/add\`: Add a product to the cart.
- \`POST /cart/remove\`: Remove a product from the cart.

- \`POST /checkout\`: Process an order.

