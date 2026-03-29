from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from config import Config
from models import db, User, Message, Product, CartItem, Order, OrderItem, Review
import os

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Setup database and seed data if needed ---
with app.app_context():
    db.create_all()
    if Product.query.count() == 0:
        p1 = Product(name='3 KG Plastic Container', description='Suitable for storage of biscuits.', price=100.0, category='containers')
        p2 = Product(name='5 KG Plastic Container', description='Ideal for medium-scale storage.', price=300.0, category='containers')
        p3 = Product(name='6 KG Plastic Container', description='Best suited for bulk storage.', price=500.0, category='containers')
        db.session.add_all([p1, p2, p3])
        db.session.commit()

# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        # Simple JSON handling for signup or Form handling
        data = request.json if request.is_json else request.form
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
            
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        if request.is_json:
            return jsonify({'success': True, 'redirect': url_for('dashboard')})
        return redirect(url_for('dashboard'))
        
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        data = request.json if request.is_json else request.form
        email = data.get('email')
        password = data.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            if request.is_json:
                return jsonify({'success': True, 'redirect': url_for('dashboard')})
            return redirect(url_for('dashboard'))
            
        return jsonify({'error': 'Invalid credentials'}), 401
        
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/api/me')
def api_me():
    if current_user.is_authenticated:
        return jsonify({'logged_in': True, 'user': {'name': current_user.username, 'email': current_user.email}})
    return jsonify({'logged_in': False})

@app.route('/products')
def products():
    products_list = Product.query.all()
    return render_template('products.html', products=products_list)

@app.route('/gallery')
def gallery():
    return render_template('gallery.html')

@app.route('/virtual-tour')
def virtual_tour():
    return render_template('virtual-tour.html')

@app.route('/reviews')
def reviews():
    return render_template('reviews.html')

@app.route('/cart')
@login_required
def cart():
    items = CartItem.query.filter_by(user_id=current_user.id).all()
    subtotal = sum(item.product.price * item.quantity for item in items if item.product)
    tax = round(subtotal * 0.05)
    total = subtotal + tax
    return render_template('cart.html', items=items, subtotal=subtotal, tax=tax, total=total)

@app.route('/api/cart/add', methods=['POST'])
@login_required
def add_to_cart():
    data = request.json
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    item = CartItem.query.filter_by(user_id=current_user.id, product_id=product_id).first()
    if item:
        item.quantity += quantity
    else:
        new_item = CartItem(user_id=current_user.id, product_id=product_id, quantity=quantity)
        db.session.add(new_item)
        
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/cart/remove', methods=['POST'])
@login_required
def remove_from_cart():
    cart_item_id = request.form.get('cart_item_id')
    if cart_item_id:
        item = CartItem.query.filter_by(id=cart_item_id, user_id=current_user.id).first()
        if item:
            db.session.delete(item)
            db.session.commit()
    return redirect(url_for('cart'))

@app.route('/api/cart/update', methods=['POST'])
@login_required
def update_cart():
    data = request.json
    cart_item_id = data.get('cart_item_id')
    action = data.get('action') # 'increase' or 'decrease'
    
    if not cart_item_id or not action:
        return jsonify({'error': 'Missing parameters'}), 400
        
    item = CartItem.query.filter_by(id=cart_item_id, user_id=current_user.id).first()
    if not item:
        return jsonify({'error': 'Item not found'}), 404
        
    if action == 'increase':
        item.quantity += 1
    elif action == 'decrease' and item.quantity > 1:
        item.quantity -= 1
        
    db.session.commit()
    
    # Recalculate totals
    cart_items = CartItem.query.filter_by(user_id=current_user.id).all()
    subtotal = sum(i.product.price * i.quantity for i in cart_items if i.product)
    tax = round(subtotal * 0.05)
    total = subtotal + tax
    
    return jsonify({
        'success': True,
        'new_quantity': item.quantity,
        'item_total': int(item.product.price * item.quantity),
        'subtotal': int(subtotal),
        'tax': int(tax),
        'grand_total': int(total)
    })

@app.route('/api/cart/count')
def cart_count():
    if current_user.is_authenticated:
        count = db.session.query(db.func.sum(CartItem.quantity)).filter(CartItem.user_id == current_user.id).scalar() or 0
        return jsonify({'count': count})
    return jsonify({'count': 0})


@app.route('/checkout', methods=['GET', 'POST'])
@login_required
def checkout():
    cart_items = CartItem.query.filter_by(user_id=current_user.id).all()
    subtotal = sum(item.product.price * item.quantity for item in cart_items if item.product)
    tax = round(subtotal * 0.05)
    total = subtotal + tax
    if request.method == 'POST':
        # Implement mock checkout flow
        if not cart_items:
            return jsonify({'error': 'Cart is empty'}), 400
            
        total = sum(item.product.price * item.quantity for item in cart_items if item.product)
        order = Order(user_id=current_user.id, total_amount=total, status='Completed')
        db.session.add(order)
        db.session.flush() # Get order ID
        
        for item in cart_items:
            order_item = OrderItem(order_id=order.id, product_id=item.product_id, 
                                   quantity=item.quantity, price_at_purchase=item.product.price)
            db.session.add(order_item)
            db.session.delete(item)
            
        db.session.commit()
        if request.is_json:
            return jsonify({'success': True, 'redirect': url_for('success', order_id=order.id)})
        return redirect(url_for('success', order_id=order.id))
        
    return render_template('checkout.html', cart_items=cart_items, subtotal=subtotal, tax=tax, total=total)

@app.route('/success')
def success():
    order_id = request.args.get('order_id')
    if not order_id or order_id == 'Unknown':
        import random
        order_id = 'Guest-' + str(random.randint(10000, 99999))
    return render_template('success.html', order_id=order_id)

@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    product_id = request.args.get('product')
    if product_id:
        reviews = Review.query.filter_by(product_id=product_id).order_by(Review.created_at.desc()).all()
    else:
        reviews = Review.query.order_by(Review.created_at.desc()).all()
        
    reviews_data = []
    for r in reviews:
        reviews_data.append({
            'id': r.id,
            'productId': r.product_id,
            'author': r.author,
            'avatar': r.author[0].upper() if r.author else 'A',
            'rating': r.rating,
            'title': r.title,
            'text': r.text,
            'pros': r.pros,
            'cons': r.cons,
            'isRecommended': r.is_recommended,
            'isVerified': r.is_verified,
            'date': r.created_at.strftime('%Y-%m-%d'),
            'images': r.images.split(',') if r.images else [],
            'helpful': r.helpful_count
        })
    return jsonify(reviews_data)

@app.route('/api/reviews', methods=['POST'])
def post_review():
    data = request.json
    try:
        new_review = Review(
            product_id=data.get('product_id'),
            author=data.get('author') or 'Anonymous',
            rating=int(data.get('rating')),
            title=data.get('title'),
            text=data.get('text'),
            pros=data.get('pros'),
            cons=data.get('cons'),
            is_recommended=data.get('is_recommended', True),
            is_verified=False,
            images=','.join(data.get('images', [])) if data.get('images') else None
        )
        db.session.add(new_review)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.json if request.is_json else request.form
    name = data.get('name')
    email = data.get('email')
    subject = data.get('subject', '')
    message_content = data.get('message')
    
    if not all([name, email, message_content]):
        return jsonify({'error': 'Missing required fields'}), 400
        
    new_message = Message(name=name, email=email, subject=subject, message_content=message_content)
    db.session.add(new_message)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Message sent successfully'})

@app.route('/dashboard')
@login_required
def dashboard():
    # Fetch user's orders, sorted by date descending (assuming id correlates or created_at exists)
    user_orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    return render_template('dashboard.html', user=current_user, orders=user_orders)

@app.route('/api/user/change_password', methods=['POST'])
@login_required
def change_password():
    data = request.json
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    if not current_password or not new_password or not confirm_password:
        return jsonify({'error': 'All fields are required.'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'New passwords do not match.'}), 400

    if not current_user.check_password(current_password):
        return jsonify({'error': 'Incorrect current password.'}), 400

    current_user.set_password(new_password)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Password changed successfully.'})

if __name__ == '__main__':
    app.run(debug=True)
