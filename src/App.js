import React, { useState, useEffect, useCallback } from 'react';
import md5 from 'md5';
import './App.css';

const App = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [itemsPerPage] = useState(50);
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const authToken = md5(`Valantis_${timestamp}`);

  const fetchProducts = useCallback(async (offset, limit) => {
    try {
      const response = await fetch('http://api.valantis.store:40000/', {
        headers: {
          'X-Auth': `${authToken}`,
          "Content-Type": "application/json",
        },
        method: 'POST',
        body: JSON.stringify({
          action: 'get_ids',
          params: { offset: offset, limit: limit }
        })
      });
      if (!response.ok) {
        throw new Error('Ошибка HTTP: ' + response.status);
      }
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Ошибка при получении списка товаров:', error);
    }
  }, [authToken]);

  const fetchProductDetails = useCallback(async (ids) => {
    try {
      const response = await fetch('http://api.valantis.store:40000/', {
        headers: {
          'X-Auth': `${authToken}`,
          "Content-Type": "application/json",
        },
        method: 'POST',
        body: JSON.stringify({
          action: 'get_items',
          params: { ids: ids }
        })
      });
      if (!response.ok) {
        throw new Error('Ошибка HTTP: ' + response.status);
      }
      const data = await response.json();
      const uniqueProductsMap = {};
      const uniqueProducts = [];
  
      data.result.forEach(product => {
        if (!uniqueProductsMap[product.id]) {
          uniqueProductsMap[product.id] = true;
          uniqueProducts.push({
            id: product.id,
            product: product.product,
            price: product.price,
            brand: product.brand 
          });
        }
      });
  
      setProducts(uniqueProducts);
      setFilteredProducts(uniqueProducts);
    } catch (error) {
      console.error('Ошибка при получении деталей товаров:', error);
    }
  }, [authToken]);

  const handlePageChange = useCallback(async (newPage) => {
    const offset = (newPage - 1) * itemsPerPage;
    const ids = await fetchProducts(offset, itemsPerPage);
    fetchProductDetails(ids);
    setPage(newPage);
  }, [fetchProducts, fetchProductDetails, itemsPerPage]);

  const filterProducts = useCallback(async (filters) => {
    try {
      const response = await fetch('http://api.valantis.store:40000/', {
        headers: {
          'Content-Type': 'application/json',
          'X-Auth': `${authToken}`
        },
        method: 'POST',
        body: JSON.stringify({ 
          action: 'filter', 
          params: filters 
        })
      });
      if (!response.ok) {
        throw new Error('HTTP Error: ' + response.status);
      }
      const filteredData = await response.json();
      setFilteredProducts(filteredData.result);
    } catch (error) {
      console.error('Ошибка при фильтрации товаров:', error);
    }
  }, [authToken]);
  const delayedFilterProducts = useCallback((filters) => {
    setTimeout(() => {
      filterProducts(filters);
    }, 500);
  }, [filterProducts]);

   
  useEffect(() => {
    setFilteredProducts(products); // Сброс отфильтрованных товаров перед обновлением
    handlePageChange(page); // Вызов обновления списка товаров при изменении страницы
  }, [handlePageChange, products, page]); // Учитываем изменения в products и page
  
  useEffect(() => {
    delayedFilterProducts({}); // Применяем пустые фильтры для отображения всех товаров
  }, [delayedFilterProducts]); 

  return (
    <div style={{padding: '20px'}}>
      <h1>Список товаров</h1>
      
      <input className='inputField' type="text" placeholder="Фильтр по названию" onChange={(e) => delayedFilterProducts({ product: e.target.value })} />
      <input className='inputField' type="number" placeholder="Фильтр по цене" onChange={(e) => delayedFilterProducts({ price: parseFloat(e.target.value) })} />
      <input className='inputField' type="text" placeholder="Фильтр по бренду" onChange={(e) => delayedFilterProducts({ brand: e.target.value })} />
      <div className="productList">
        {filteredProducts.map((product, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <h3>{product.name}</h3>
            <p>ID: {product.id}</p>
            <p>Название: {product.product}</p>
            <p>Цена: {product.price}</p>
            <p>Бренд: {product.brand}</p>
          </div>
        ))}
      </div>
      <br />
      <button className='button' disabled={page === 1} onClick={() => handlePageChange(page - 1)}>Предыдущая страница</button>
      <span>{page}</span>
      <button className='button' disabled={products.length < itemsPerPage} onClick={() => handlePageChange(page + 1)}>Следующая страница</button>
      
      
    </div>
  );
};

export default App;
